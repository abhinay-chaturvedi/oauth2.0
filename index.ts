
import express,{Express,Request,Response} from "express"
import axios from "axios"
import qs from "qs";
import jwt from "jsonwebtoken"
const app:Express =express();
console.log(__dirname);
app.use(express.static(__dirname+"/public"));
import {Sequelize,DataTypes} from "sequelize";

const sequelize = new Sequelize(
   'test',
   'root',
   'chaturvedi',
    {
      host: 'localhost',
      dialect: 'mysql'
    }
  );


sequelize.authenticate().then(() => {
   console.log('Connection has been established successfully.');
}).catch((error:any) => {
   console.error('Unable to connect to the database: ', error);
});


const User = sequelize.define("users", {
   name: {
     type: DataTypes.STRING,
     allowNull: false
   },
   email: {
     type: DataTypes.STRING,
     allowNull: false
   },
   picture: {
     type: DataTypes.STRING,
     allowNull: false
   },
});
sequelize.sync().then(() => {
    console.log('User table created successfully!');
 }).catch((error) => {
    console.error('Unable to create table : ', error);
 });
 
app.get("/",(req:Request,res:Response)=>{
    res.redirect("/login.html");
})
const getIdAndToken=async (code:string)=>{

    const url=" https://oauth2.googleapis.com/token"

const values={
    code,
    client_id:"963367235757-1pq2sc98fnknc8lvho5bmnahd65v8k84.apps.googleusercontent.com",
    client_secret:"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",
    redirect_uri:"http://localhost:8800/api/oauth",
    grant_type:"authorization_code"
}
try{
    const response=await axios.post(url,qs.stringify(values),
    {
        headers:{
            "Content-Type":"application/x-www-form-urlencoded",

        }
    })
    return response.data;
}
catch(err){
    console.log(err);
    return err;
}
}
const getUserDetails=async (id_token:string,access_token:string)=>{
    try{
        const url=`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
        const response=await axios.get(url,{
            headers:{
                Authorization:`Bearer ${id_token}`
            }
        })
        return response.data;
    }catch(err){
        console.log(err);
        throw  err;
    }
}
app.get("/api/oauth",async (req:Request,res:Response)=>{
    // here we will be getting the code the google sennd
    const code:string =req.query.code as string;
    console.log(code);
    try{
        // with the help of this code i will be getting the access token and idtoken
    const tokensResult=await getIdAndToken(code);
    // console.log(tokensResult);

    // now with the help of these tokens i will be getting the user information
    // whichever we are allowed
const userDetails=await getUserDetails(tokensResult.id_token,tokensResult.access_token);
console.log(userDetails);


    // now i have to store the user in database if not exist and if exist 
    // then i have to update that user

    User.create({
        name:userDetails.name,
        email:userDetails.email,
        picture:userDetails.picture
    }).then(res=>{
        console.log(res);
    }).catch((err)=>{
        console.log(err);
    })

    
    



    // finally creating the access token and refresh token for the user

    const token=jwt.sign(userDetails,"secret",{expiresIn:"15d"});
    const refreshToken=jwt.sign(userDetails,"secret",{expiresIn:"365d"})
    // above tokens i can use for session handling of the user
    res.send({...userDetails,token,refreshToken});
    // redirect to home page of web application
    
    }catch(err){
        res.send(err);
    }
    
})
app.listen(8800,()=>{
    console.log("server is listening on port 8800")
})

