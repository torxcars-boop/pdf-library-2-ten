import { NextResponse } from "next/server";

const EASYORDERS_API_URL =
  "https://api.easy-orders.net/v1/products";

export async function GET() {
  try {
    const apiKey = process.env.EASYORDERS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "EASYORDERS_API_KEY is missing",
        },
        { status: 500 }
      );
    }

    const response = await fetch(EASYORDERS_API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const text = await response.text();

    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        raw: text,
      };
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          status: response.status,
          error: "EasyOrders API returned an error",
          details: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("EasyOrders API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to connect to EasyOrders",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}
