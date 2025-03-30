const dotenv = require('dotenv');
dotenv.config();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const express = require('express')
const router = express.Router();
const jwt = require('jsonwebtoken')
const SECRET_KEY = process.env.JWT_SECRET

function generatToken(user){
    const payload={
        username:user.username,
        email:user.email
    }
    const token = jwt.sign(payload,SECRET_KEY);
    return token;
}

router.post("/login", async (req, res) => {
    const { email, password } = req.body;  
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .single(); 
        if (error) {
            console.error('Supabase query error:', error);
            return res.status(500).json({ err: error.message });  
        }
        if (!data) {
            return res.status(404).json({ err: "User not found" });
        }

        return res.status(200).json({ success: true, user: data });

    } catch (err) {
        console.error('Server error:', err);
        return res.status(500).json({ err: err.message });  
    }
});


router.post("/signup",async (req,res)=>{
    const {Name, Email, CountryCode, Mobile, Password} = req.body;
    const userdata=
    {
        "username": Name,
        "email":Email
    }
    const token = generatToken(userdata)
    try{
        const {data,error} = await supabase
        .from('users')
        .insert([{username:Name,email:Email,countrycode:CountryCode,mobile:Mobile,password:Password,token:token}])
        .select()
        if(error){
            console.error('Supabase query error:', error);
            return res.status(500).json({ err: error.message }); 
        }
        user = data[0]; 

        return res.status(200).json({"success":true,"username":user.username,"role":"patient","token":token})
    }catch(err){
        res.status(500).json({err:err.message})
    }

});

module.exports = router