const Medication = require('../models/Medication');
const axios = require('axios');

// Search medications from database or fetch from RxNorm
const searchMedications = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // First check our database
    const localMedications = await Medication.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { genericName: { $regex: query, $options: 'i' } }
      ]
    });
    
    // If medication exists in our database, return it
    if (localMedications.length > 0) {
      return res.status(200).json(localMedications);
    }
    
    // If not found in database, fetch from RxNorm API
    try {
      // Get medication info from RxNorm API
      const response = await axios.get(
        `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(query)}`
      );
      
      if (!response.data || !response.data.drugGroup || !response.data.drugGroup.conceptGroup) {
        return res.status(200).json([]);
      }
      
      // Process the response data
      const medicationsData = response.data.drugGroup.conceptGroup
        .filter(group => group.conceptProperties)
        .flatMap(group => {
          return group.conceptProperties.map(med => ({
            id: med.rxcui,
            name: med.name,
            genericName: med.synonym || med.name,
            classification: group.tty || 'Medication',
            prescriptionRequired: group.tty === 'SBD' || group.tty === 'SCD',
            description: `${med.name} information from RxNorm.`
          }));
        });
      
      // Save first medication to our database for future queries
      if (medicationsData.length > 0) {
        const firstMed = medicationsData[0];
        const newMedication = new Medication({
          name: firstMed.name,
          genericName: firstMed.genericName,
          classification: firstMed.classification,
          rxcui: firstMed.id,
          description: firstMed.description
      });
      
      await newMedication.save();
      }
      
      res.status(200).json(medicationsData);
    } catch (apiError) {
      console.error('Error fetching from RxNorm API:', apiError);
      // If API fails, return a generic placeholder
      const placeholderMedication = {
        name: query,
        genericName: query,
        description: 'Information not available at the moment. Please consult with your healthcare provider.',
        indications: 'Please consult with your healthcare provider.',
        warnings: 'Always consult with your healthcare provider before taking any medication.'
      };
      res.status(200).json([placeholderMedication]);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get medication by ID (rxcui)
const getMedicationById = async (req, res) => {
  try {
    // First try to find in our database
    const medication = await Medication.findOne({ 
      $or: [
        { _id: req.params.id },
        { rxcui: req.params.id }
      ]
    });
    
    if (medication) {
      return res.status(200).json(medication);
    }
    
    // If not in database, fetch from RxNorm
    try {
      // Get multiple endpoints for complete information
      const [basicInfoRes, propertiesRes, ndcRes, classRes] = await Promise.all([
        axios.get(`https://rxnav.nlm.nih.gov/REST/rxcui/${req.params.id}/allrelated.json`),
        axios.get(`https://rxnav.nlm.nih.gov/REST/rxcui/${req.params.id}/allProperties.json?prop=names+attributes`),
        axios.get(`https://rxnav.nlm.nih.gov/REST/rxcui/${req.params.id}/ndcs.json`),
        axios.get(`https://rxnav.nlm.nih.gov/REST/rxclass/class/byRxcui.json?rxcui=${req.params.id}`)
      ]);
      
      // Extract information from responses
      const allConcepts = basicInfoRes.data?.allRelatedGroup?.conceptGroup || [];
      const properties = propertiesRes.data?.propConceptGroup?.propConcept || [];
      
      // Extract medication name and details
      const nameProps = properties.filter(prop => prop.propName === 'RxNorm Name');
      const ttyProps = properties.filter(prop => prop.propName === 'TTY');
      
      // Find class information
      const mayTreatProps = allConcepts.find(group => group.tty === 'DISEASE')?.conceptProperties || [];
      const mayPreventProps = allConcepts.find(group => group.tty === 'DISEASEF')?.conceptProperties || [];
      
      // Determine if prescription or OTC
      const isPrescription = ttyProps.some(prop => 
        ['SBD', 'SCD', 'BPCK', 'GPCK', 'SCDC', 'SCDF', 'SCDG'].includes(prop.propValue)
      );
      
      // Get basic information
      const medName = nameProps.length > 0 ? nameProps[0].propValue : 'Unknown Medication';
      
      // Get generic name if available
      const ingredientProps = allConcepts.find(group => group.tty === 'IN')?.conceptProperties || [];
      const genericName = ingredientProps.length > 0 
        ? ingredientProps[0].name 
        : 'Generic information not available';
      
      // Get class information
      let classification = 'Medication';
      if (classRes.data && classRes.data.rxclassDrugInfoList) {
        const classInfo = classRes.data.rxclassDrugInfoList.rxclassDrugInfo;
        if (classInfo && classInfo.length > 0) {
          classification = classInfo[0].rxclassMinConceptItem.className;
        }
      }
      
      // Construct medication object
      const medicationData = {
        rxcui: req.params.id,
        name: medName,
        genericName: genericName,
        classification: classification,
        description: `${medName} (${genericName}) is used for various medical conditions.`,
        form: "Various forms may be available",
        availability: isPrescription ? "Prescription" : "Over-the-counter",
        usage: "Specific usage information not provided. Consult your healthcare provider for proper use.",
        sideEffects: "Side effects information not available from this source. Consult your healthcare provider.",
        precautions: "Consult your healthcare provider before taking this medication.",
        interactions: "Consult your healthcare provider for potential drug interactions.",
        storageConditions: "Store as directed on the packaging or as advised by your pharmacist.",
        indications: [...new Set([...mayTreatProps.map(prop => prop.name), ...mayPreventProps.map(prop => prop.name)])]
      };
      
      // Save to database for future queries
      const newMedication = new Medication({
        name: medicationData.name,
        genericName: medicationData.genericName,
        classification: medicationData.classification,
        rxcui: medicationData.rxcui,
        description: medicationData.description,
        indications: medicationData.indications.join(', '),
        sideEffects: medicationData.sideEffects,
        interactions: medicationData.interactions
      });
      
      await newMedication.save();
      
      res.status(200).json(medicationData);
    } catch (apiError) {
      console.error('Error fetching from RxNorm API:', apiError);
      return res.status(404).json({ message: 'Medication not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add medication (for admin)
const addMedication = async (req, res) => {
  try {
    const newMedication = new Medication(req.body);
    await newMedication.save();
    
    res.status(201).json(newMedication);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check interactions between multiple medications using RxNorm API
const checkInteractions = async (req, res) => {
  try {
    const { medications } = req.body;
    
    if (!medications || !Array.isArray(medications) || medications.length < 2) {
      return res.status(400).json({ 
        message: 'Please provide at least two medications to check for interactions' 
      });
    }
    
    // Get RxCUI identifiers for each medication
    const rxcuiPromises = medications.map(async (medName) => {
      try {
        // First check if we have this medication in our database
        const dbMed = await Medication.findOne({ 
          name: { $regex: new RegExp(`^${medName}$`, 'i') }
        });
        
        if (dbMed && dbMed.rxcui) {
          return dbMed.rxcui;
        }
        
        // If not in database, search RxNorm
        const response = await axios.get(
          `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(medName)}`
        );
        
        if (response.data?.drugGroup?.conceptGroup) {
          const conceptGroup = response.data.drugGroup.conceptGroup
            .filter(group => group.conceptProperties)
            .flatMap(group => group.conceptProperties);
          
          if (conceptGroup.length > 0) {
            return conceptGroup[0].rxcui;
          }
        }
        
        return null;
      } catch (error) {
        console.error(`Error getting RxCUI for ${medName}:`, error);
        return null;
      }
    });
    
    const rxcuis = await Promise.all(rxcuiPromises);
    const validRxcuis = rxcuis.filter(rxcui => rxcui !== null);
    
    if (validRxcuis.length < 2) {
      return res.status(400).json({
        message: 'Could not find valid identifiers for at least two medications'
      });
    }
    
    // Check for interactions using RxNorm API
    const interactionResponse = await axios.get(
      `https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${validRxcuis.join('+')}`
    );
    
    if (!interactionResponse.data?.fullInteractionTypeGroup) {
      return res.status(200).json({
        interactions: [],
        message: 'No interactions found between the specified medications'
      });
    }
    
    // Process and format the interaction data
    const interactionGroups = interactionResponse.data.fullInteractionTypeGroup;
    const formattedInteractions = [];
    
    interactionGroups.forEach(group => {
      if (group.fullInteractionType) {
        group.fullInteractionType.forEach(interaction => {
          if (interaction.interactionPair) {
            interaction.interactionPair.forEach(pair => {
              formattedInteractions.push({
                drugs: [
                  pair.interactionConcept[0].minConceptItem.name,
                  pair.interactionConcept[1].minConceptItem.name
                ],
                description: pair.description,
                severity: pair.severity || 'Unknown'
              });
            });
          }
        });
      }
    });
    
    res.status(200).json({
      interactions: formattedInteractions,
      severityLevel: [...new Set(formattedInteractions.map(i => i.severity))],
      recommendations: 'Consult with your healthcare provider about these potential interactions.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  searchMedications,
  getMedicationById,
  addMedication,
  checkInteractions
}; 