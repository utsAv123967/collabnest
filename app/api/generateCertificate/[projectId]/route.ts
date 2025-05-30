import { NextRequest, NextResponse } from 'next/server';
import { createCanvas } from 'canvas';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { sendMail } from '@/lib/sendMail.server.ts';

const prisma = new PrismaClient();

// const handleGenerateCertificate = async () => {
//     try {
//         const response = await fetch(`/api/generateCertificate/${projectId}`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//         });

//         if (!response.ok) {
//             throw new Error(`Error: ${response.status}`);
//         }

//         const data = await response.json();
//         alert('Certificate generation request sent successfully!');
//         console.log(data);
//     } catch (error) {
//         console.error('Failed to generate certificate:', error);
//         alert('Failed to generate certificate');
//     }
// };

async function generateCertificate(user: any, projectId: string) {
    const canvas = createCanvas(1000, 700);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.fillStyle = '#000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Certificate of Completion', canvas.width / 2, 150);
    ctx.font = '24px Arial';
    ctx.fillText('This is to certify that', canvas.width / 2, 250);
    ctx.font = 'bold 40px Georgia';
    ctx.fillText(user.name, canvas.width / 2, 330);
    ctx.font = '24px Arial';
    ctx.fillText('has successfully completed the project.', canvas.width / 2, 400);
    ctx.font = '20px Arial';
    ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, canvas.width / 2, 500);

    const buffer = canvas.toBuffer('image/png');
    const fileName = `${projectId}-${user.id}-certificate.png`;
    const filePath = path.join(process.cwd(), 'public', 'certificates', fileName);
    fs.writeFileSync(filePath, buffer);

    await sendMail({
        to: user.email,
        subject: 'Certificate of Completion',
        message: 'Congratulations! You have successfully completed the project.',
        attachmentPath: filePath,
        attachmentFilename: fileName,
        htmlMessage: '<h1>Congratulations!</h1><p>You have successfully completed the project.</p>',
    });

    // const certificateUrl = `/certificates/${fileName}`;

    // await prisma.projectMember.update({
    //     where: { id: member.id },
    //     data: { certificateUrl },
    // });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;

    try {
        const projectMember = await prisma.projectMember.findFirst({
            where: { projectId },
            include: { user: true },
        });

        if (!projectMember) {
            return NextResponse.json({ error: 'No project members found' }, { status: 404 });
        }

        await generateCertificate(projectMember.user, projectId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to generate certificates' }, { status: 500 });
    }
}
