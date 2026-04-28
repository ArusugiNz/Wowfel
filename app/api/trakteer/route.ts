import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Trakteer webhook payloads often contain the supporter's message.
        // We check a few possible keys just in case.
        const message = body.supporter_message || body.message || body.support_message || "";
        
        // Use Regex to find the Order ID (e.g. ORD-1234)
        const match = message.match(/ORD-\d{4}/);

        if (match) {
            const orderId = match[0];
            
            // Search for the transaction in Firebase
            const q = query(collection(db, "transactions"), where("orderId", "==", orderId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const transactionDoc = querySnapshot.docs[0];
                const data = transactionDoc.data();

                // Only update if it's not already confirmed or cancelled
                if (data.status !== "confirmed" && data.status !== "cancelled") {
                    await updateDoc(doc(db, "transactions", transactionDoc.id), {
                        status: "confirmed",
                        trakteerWebhookReceivedAt: new Date().toISOString()
                    });
                    
                    console.log(`[Trakteer Webhook] Automatically confirmed order ${orderId}`);
                    return NextResponse.json({ success: true, message: `Order ${orderId} confirmed.` }, { status: 200 });
                } else {
                    return NextResponse.json({ success: true, message: `Order ${orderId} is already ${data.status}.` }, { status: 200 });
                }
            } else {
                console.warn(`[Trakteer Webhook] Order ${orderId} not found in database.`);
                return NextResponse.json({ success: false, message: `Order ${orderId} not found.` }, { status: 404 });
            }
        }

        console.log(`[Trakteer Webhook] No Order ID found in message: "${message}"`);
        return NextResponse.json({ success: true, message: "No Order ID found in message." }, { status: 200 });
        
    } catch (error) {
        console.error("[Trakteer Webhook] Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
