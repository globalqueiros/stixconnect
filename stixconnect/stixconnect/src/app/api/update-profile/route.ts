import { NextResponse } from "next/server";
import db from "../../lib/db";

export async function POST(req: Request) {
    try {
        const { image, userId } = await req.json();

        if (!image || !userId) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

        await db.execute("UPDATE representante SET image = ? WHERE id = ?", [image, userId]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 });
    }
}
