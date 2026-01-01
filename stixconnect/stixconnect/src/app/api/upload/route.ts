import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    endpoint: `https://s3.${process.env.AWS_REGION}.amazonaws.com`,
    forcePathStyle: false,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
        }

        const bucketName = process.env.AWS_BUCKET_NAME!;
        const folderName = "revendedores";
        const fileName = `${randomUUID()}-${file.name}`;
        const filePath = `${folderName}/${fileName}`;

        const buffer = Buffer.from(await file.arrayBuffer());

        await s3.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: filePath,
            Body: buffer,
            ContentType: file.type,
            ACL: "public-read",
        }));

        const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath}`;

        return NextResponse.json({ url: fileUrl });
    } catch (error) {
        console.error("Erro ao fazer upload para o S3:", error);
        return NextResponse.json({ error: "Erro no upload." }, { status: 500 });
    }
}