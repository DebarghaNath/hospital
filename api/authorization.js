const dotenv = require('dotenv');
dotenv.config();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const express = require('express')
const router = express.Router();
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const SECRET_KEY = process.env.JWT_SECRET
const sendMail = require('./mailer')
async function Mail(email,message){
    try{
        sendMail(email,message);
        console.log("done");
    }catch(err){
        console.log(err.message)
    }
}
function generatToken(user){
    const payload={
        username:user.username,
        email:user.email
    }
    const token = jwt.sign(payload,SECRET_KEY);
    return token;
}
function generatePassWord(length)
{
    const charset = [
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        'abcdefghijklmnopqrstuvwxyz',
        '0123456789',
        '!@#$%^&*()_+{}[]<>?'
    ];

    let password = "";
    while (password.length < length) {
        const w = Math.floor(Math.random() * charset.length);
        const val = charset[w];
        const index = Math.floor(Math.random() * val.length);
        password += val[index];
    }
    
    return password;

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
    const {name, email, age, weight, gender,bloodgroup,totalcharges,patientcontact,patientaddress} = req.body;
    const userdata=
    {
        "username": name,
        "email":email
    }
    const token = generatToken(userdata)
    try{
        const {data,error} = await supabase
        .from('patients')
        .insert([{patientname:name,email:email,age:age,weight:weight,gender:gender,bloodgroup:bloodgroup,totalcharges:totalcharges,patientcontact:patientcontact,patient_address:patientaddress,token:token}])
        .select()

        if(error){
            console.error('Supabase query error:', error);
            return res.status(500).json({ err: error.message }); 
        }
        user = data[0]; 

        return res.status(200).json({"success":true,"role":"patient","token":token})
    }catch(err){
        res.status(500).json({err:err.message})
    }

});
router.put("/submit-password", async (req, res) => {
    const { email, password } = req.body;

    try {
        const {data,error } = await supabase
            .from('users')
            .update({ password: password }) 
            .eq('email', email)
            .select();
        console.log(data)
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        if(data.length==0)
            {
                return res.status(500).json({ error:"user not found" });   
            }
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.put("/addusers",async (req,res)=>{
    const {name,email,mobile,role} = req.body;
    const password = generatePassWord(12);

    try{
        const {data,error} = await supabase
        .from('users')
        .insert([{name:name,email:email,mobile:mobile,role:role,password:password}])
        .select()
        if(error){
            return res.status(500).json({err:error,message})
        }
        const message = `You are given the role : ${role} and your new password is : ${password}`
        await Mail(email,message)
        return res.status(200).json({"status":"done"})
    }catch(err){
        return res.status(500).json({err:err.message})
    }
})

router.delete("/deleteusers",async(req,res)=>{
    const {id} = req.body;
    try{
        const {data,error} = await supabase
        .from('users')
        .delete()
        .eq('userid',id)

        if(error){
            return res.status(500).json({err:err.message})
        }

        return res.status(200).json({"status":"done"})
    }catch(err){
        return res.status(500).json({err:err.message})
    }
})

router.delete("/deleteusers",async(req,res)=>{
    const {id} = req.body;
    try{
        const {data,error} = await supabase
        .from('users')
        .delete()
        .eq('userid',id)

        if(error){
            return res.status(500).json({err:err.message})
        }

        return res.status(200).json({"status":"done"})
    }catch(err){
        return res.status(500).json({err:err.message})
    }
})

router.get('/showusers',async(req,res)=>{
    try{
        const {data,error} = await supabase
        .from('users')
        .select('*')

        if(error){
            return res.status(500).json({err:err.message})
        }
        return res.status(200).json({"data":data})
    }catch(err){
        return res.status(500).json({err:err.message})
    }
})

module.exports = router