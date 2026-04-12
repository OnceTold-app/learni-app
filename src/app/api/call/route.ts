import { NextRequest, NextResponse } from 'next/server'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || ''
const EARNI_AGENT_ID = 'agent_0701kp025ajmeawv606w6p9c3rsj'
const EARNI_PHONE_ID = 'phnum_6101knde4m7bfaxsfv0dmqsa7yy3'

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, childName, callType = 'welcome_parent' } = await req.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: 'phoneNumber required' }, { status: 400 })
    }

    // Clean phone number — ensure it starts with +
    let cleanNumber = phoneNumber.replace(/\s/g, '')
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '+64' + cleanNumber.slice(1) // NZ number
    }
    if (!cleanNumber.startsWith('+')) {
      cleanNumber = '+' + cleanNumber
    }

    // Set dynamic first message based on call type
    const firstMessage = callType === 'welcome_child'
      ? `Hey! Is this ${childName || 'there'}? This is Earni from Learni!`
      : `Hi! This is Earni from Learni. Am I speaking with ${childName ? childName + "'s parent" : 'a parent'}?`

    // Trigger outbound call via ElevenLabs
    const response = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: EARNI_AGENT_ID,
        agent_phone_number_id: EARNI_PHONE_ID,
        to_number: cleanNumber,
        conversation_initiation_client_data: {
          dynamic_variables: {
            child_name: childName || '',
            call_type: callType,
          },
        },
        first_message: firstMessage,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('ElevenLabs call error:', err)
      return NextResponse.json({ error: 'Failed to initiate call' }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json({ success: true, callId: data.call_id || data.conversation_id })
  } catch (error) {
    console.error('Call error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
