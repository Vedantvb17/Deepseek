import connectDB from "@config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function  GET(req) {
     try {
        const {userId} = getAuth(req);

        if(!userId) {
            return NextResponse.json({
                success: false,
                message: "Usernot authenticated",
            });
        }

        await connectDB();
        const data = await Chat.find({userId});

        return NextResponse.json({success: true, data})
        
     } catch (error) {
        return NextResponse.json({success: false, error: error.message});
     }
}