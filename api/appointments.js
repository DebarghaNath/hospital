const dotenv = require('dotenv');
dotenv.config();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const express = require('express')
const router = express.Router();

async function fetchAppointments(req,res,next)
{
    const date = req.query.date||req.body.date
    if(!date){
        return res.status(400).json({err:"Date Parameter is required"});
    }
    try{
        const {data,error} = await supabase
        .from('appointments')
        .select('time')
        .eq('date',date)
        if(error){
            return res.status(500).json({err:error.message})
        }
        req.appointments = data;
        next();
    }catch(err){
        return res.status(500).json({err:err.message})
    }
}
router.post("/book",fetchAppointments,async (req, res) => 
    {
    const { patientID, doctorID, date} = req.body;
    console.log("GET /book appointments:", req.appointments);
    //console.log(req.appointments)
    const timeslot = []
    for(var i=0;i<req.appointments.length;i++)
        {
            const [hours,minutes] = req.appointments[i].time.split(":").map(Number);
            timeslot.push(hours * 60 + minutes)
        }
    timeslot.sort((a,b)=>a-b);
    console.log(timeslot)
    var availtimeslot = null;
    var flag = 0;
    for(var i=0;i<timeslot.length-1;i++)
        {
            var gap = timeslot[i+1]-timeslot[i]
            //console.log(gap)
            if(gap>=120)
                {
                    let availableSlot = timeslot[i] + 60; 
                    let hours = Math.floor(availableSlot / 60);
                    let minutes = availableSlot % 60;
                    availtimeslot = `${hours}:${minutes.toString().padStart(2, '0')}`; 
                    flag = 1;
                    break;
                }
            }
            if(!flag){if (!flag) {
                let newslot = timeslot[timeslot.length - 1]; 
                let hours = Math.floor(newslot / 60);         
                let minutes = newslot % 60;                    
                //console.log(hours,minutes)
                hours += 1;  
                availtimeslot = `${hours}:${minutes.toString().padStart(2, '0')}`;  
            }
            }
            console.log(`Available Time Slot: ${availtimeslot}`);
    try {
        const { data, error } = await supabase
            .from("appointments")
            .insert([{ patientid: patientID, doctorid: doctorID, date: date, time: availtimeslot }])
            .select("appointmentid");
        
        if (error) {
            console.error("Supabase insert error:", error);
            return res.status(500).json({ err: error.message });
        }
        
        console.log("Inserted appointment:", data);
        return res.status(200).json({ 
            success: true, 
            appointmentid: data[0].appointmentid, 
        });
    } catch (err) {
        return res.status(500).json({ err: err.message });
    }
});

router.get("/:id", async (req, res) => {
    console.log("INSIDE get appointments api");
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
        
        if (!data) 
            {
                console.log("data NOT found");
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
