import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};


export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {

  try {

    const { cartItems, customer } = await req.json();
    console.log("CART ITEMS: ", cartItems);

    if (!cartItems || !customer) {
      return new NextResponse("Not enough data to checkout", { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      shipping_address_collection: {
        allowed_countries: ["US", "SG"],  //allow payment for countries
      },
      shipping_options: [
        { shipping_rate: "shr_1PGYqRJNVpLZ6aXeIKDFJl2j" },
        { shipping_rate: "shr_1PGYrsJNVpLZ6aXecWP3Oxiq" },
      ],
      line_items: cartItems.map((cartItem: any) => ({
        price_data: {
          currency: "sgd",
          product_data: {
            name: cartItem.item.title,
            metadata: {
              productId: cartItem.item._id,
              ...(cartItem.size && { size: cartItem.size }),
              ...(cartItem.color && { color: cartItem.color }),
            },
          },
          unit_amount: cartItem.item.price * 100,
        },
        quantity: cartItem.quantity,
      })),
      client_reference_id: customer.clerkId,
      success_url: `${process.env.ECOMMERCE_STORE_URL}/payment_success`,
      cancel_url: `${process.env.ECOMMERCE_STORE_URL}/cart`,
    }
    );
    console.log("SESSION LINE ITEMS: ", session);

    return NextResponse.json(session, { headers: corsHeaders });

  } catch (err) {
    console.log("[checkout_POST]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
