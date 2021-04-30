import bcrypt from "bcrypt";
import { Express } from "express";
import { generateJWT } from "../utils/AuthUtils";
import { createResponseObject, prisma } from "./root";

export const validateEmail = (email: string) => {
    const expression = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
    return expression.test(String(email).toLowerCase())
}

/**
 * Holds all the listeners relating to authentication
 * @param app Express app instance
 */
export const authRoutes = (app: Express) => {

    app.post("/signup", async (req,res) => {

        const responseObj = createResponseObject();

        try {
            const email = req.body["email"];
            const name = req.body["name"];
            const password = req.body["password"];

            if(email !== "string" && !validateEmail(email)){
                throw Error("Invalid email format");
            }

            if(name !== "string" && name === ""){
                throw Error("Invalid name format");
            }

            if(email !== "string" && password === ""){
                throw Error("Invalid password format");
            }

            //Check if user is already registered 
            let user = await prisma.user.findFirst({where: {
                email: email
            }})

            //If already registered, throw error
            if(user) throw Error("Account with email already exists")

            const hashedPassword = await bcrypt.hash(password,8);

            
            //Creat new user
            user = await prisma.user.create({
                data: {email, name, password: hashedPassword}
            })

            responseObj.message = "Signed Up Successfully..."
            responseObj.data = {
                id: user.id
            }

        } catch (error) {
            responseObj.error = true;
            responseObj.message = error.message
        }

        res.json(responseObj);

    })

    app.post("/login", async (req,res) => {
        const responseObj = createResponseObject();

        try {
            const email = req.body["email"];
            const password = req.body["password"];

            if(email !== "string" && !validateEmail(email)){
                throw Error("Invalid email format");
            }

            if(email !== "string" && password === ""){
                throw Error("Invalid password format");
            }

            //Get the user
            let user = await prisma.user.findFirst({where: {email}})

            //If user not found
            if(!user) throw Error("Account does not exist with given email");

            const isPasswordCorrect = await bcrypt.compare(password,user.password);

            //Check password
            if(!isPasswordCorrect) throw new Error("Wrong Password");

            //Generate JWT token
            const token = generateJWT(user.id);

            responseObj.message = "Logged In Successfully..."
            responseObj.data = {
                id: user.id,
                email: user.email,
                name: user.name,
                token
            }

        } catch (error) {
            responseObj.error = true;
            responseObj.message = error.message
        }

        res.json(responseObj);

    })

}