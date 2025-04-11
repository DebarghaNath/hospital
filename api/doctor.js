const dotenv = require('dotenv');
dotenv.config();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const express = require('express')
const router = express.Router();

// GET

// All patients under a given Doctor
router.get("/:doctorid/patient",async (req,res)=>{
    const {doctorid} = req.params;
    try{
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                patientid,
                date,
                time,
                patients (patientname)
            `)
            .eq('doctorid',doctorid)
            .order('date',{ascending: false}) 
            .order('time',{ascending: false});

        if(error){
            return res.status(500).json({err:error.message})
        }
        if(!data){
            return res.status(404).json({error:"(Doctor,Patient) not found"})
        }

        let store = new Map();
        for(let patient of data){
            store.set(patient.patientid,patient);
        }
        let uniquePatients = [];
        for(let [patientid,patient] of store){
            uniquePatients.push(patient);
        }

        return res.status(200).json({"status":"success","patientdata":uniquePatients})
        
    }
    catch(err){
        return res.status(500).json({err:err.message})
    }
})

// Single patient for a given Doctor
router.get("/:doctorid/patient/:patientid",async (req,res)=>{
    const {doctorid,patientid} = req.params;
    try{
        const { data:patientData, error:patientError } = await supabase
            .from('patients')
            .select(`*`)
            .eq('patientid',patientid)

        if(patientError){
            return res.status(500).json({err:patientError.message})
        }
        if(!patientData){
            return res.status(404).json({error:"Patient not found"})
        }

        const { data:appointmentData, error:appointmentError } = await supabase
            .from('appointments')
            .select(`
                appointmentid,
                date,
                time
            `)
            .eq('doctorid',doctorid)
            .eq('patientid',patientid)
            .order('date',{ascending: false}) 
            .order('time',{ascending: false});
        
        if(appointmentError){
            return res.status(500).json({err:appointmentError.message})
        }
        if(!appointmentData){
            return res.status(404).json({error: "(Doctor,Patient) appointment not found"})
        }

        const { data:prescriptionData, error:prescriptionError } = await supabase
            .from('prescriptions')
            .select(`
                medicinename,
                dosage,
                frequency,
                duration
            `)
            .eq('doctorid',doctorid)
            .eq('patientid',patientid)

        if(prescriptionError){
            return res.status(500).json({err:prescriptionError.message})
        }

        const data = {patientData, appointmentData, prescriptionData};

        return res.status(200).json({"status":"success",data})
        
    }
    catch(err){
        return res.status(500).json({err:err.message})
    }
})

// POST

// Create a new Prescription
router.post("/:doctorid/patient/:patientid/prescription",async (req, res) => 
{
    const {doctorid,patientid} = req.params;
    const {medicinename,dosage,frequency,duration} = req.body;
    try{
        const { error:postError } = await supabase
            .from("prescriptions")
            .insert({doctorid, patientid, medicinename, dosage, frequency, duration})
        
        if (postError) {
            console.error("Supabase insert error:", postError);
            return res.status(500).json({ err: postError.message });
        }

        return res.status(200).json({ 
            success: true
        });
    } catch (err) {
        return res.status(500).json({ err: err.message });
    }
});

// PATCH 

// Update existing prescription
router.patch("/:doctorid/patient/:patientid/prescription/:medicinename",async (req, res) => 
{
    const {doctorid,patientid,medicinename} = req.params;
    const {dosage,frequency,duration} = req.body;
    try {
        const {error} = await supabase
            .from('prescriptions')
            .update({dosage,frequency,duration})
            .eq('doctorid', doctorid)
            .eq('patientid', patientid)
            .eq('medicinename', medicinename)

        if (error) {
            console.error("Supabase udpate error:", error);
            return res.status(500).json({ err: error.message });
        }

        return res.status(200).json({ 
            success: true
        });
    } catch (err) {
        return res.status(500).json({ err: err.message });
    }
})

router.delete("/:doctorid/patient/:patientid/prescription/:medicinename",async (req, res) => 
{
    const {doctorid,patientid,medicinename} = req.params;
    try {
        const { error } = await supabase
            .from('prescriptions')
            .delete()
            .eq('doctorid', doctorid)
            .eq('patientid', patientid)
            .eq('medicinename', medicinename);

        if (error) {
            console.error("Supabase delete error:", error);
            return res.status(500).json({ error: error.message });
        }
        
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ err: err.message });
    }
});

module.exports = router;