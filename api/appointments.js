const dotenv = require('dotenv');
dotenv.config();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const express = require('express')
const router = express.Router();
router.post("/book", async (req, res) => {
    const { patientID, doctorID, date, time } = req.body;
    try {
        const { data, error } = await supabase
            .from('appointments')
            .insert([{ patientid: patientID, doctorid: doctorID, date: date, time: time }])
            .select('appointmentid');
        
        if (error) {
            console.error('Supabase insert error:', error);
            return res.status(505).json({ err: error.message });
        }
        
        return res.status(200).json({ success: true, appointmentid: data[0].appointmentid });
    } catch (err) {
        return res.status(505).json({ err: err.message });
    }
});

router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('appointmentid', id)
            .single();
        
        if (error) {
            console.error('Supabase fetch error:', error);
            return res.status(500).json({ error: error.message });
        }
        
        if (!data) {
            return res.status(404).json({ error: "Appointment not found" });
        }
        
        return res.status(200).json({ appointmentDetails: data });
    } catch (err) {
        return res.status(500).json({ err: err.message });
    }
});

router.delete("/:id/cancel", async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('appointmentid', id)
            .single();
        
        if (error || !data) {
            return res.status(404).json({ error: "Appointment not found" });
        }
        
        const { error: deleteError } = await supabase
            .from('appointments')
            .delete()
            .eq('appointmentid', id);

        if (deleteError) {
            console.error("Supabase delete error:", deleteError);
            return res.status(500).json({ error: deleteError.message });
        }
        
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ err: err.message });
    }
});

module.exports = router;
