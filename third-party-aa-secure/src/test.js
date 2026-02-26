let chat =`[10:00] Human:
Hi there 👋 Is anyone available?

[10:00] Chatbot:
Hi! I’m here 😊 How can I help you today?

[10:01] Human:
I’m just testing a chatbot flow for a demo tomorrow.

[10:01] Chatbot:
Got it — happy to help with testing. Do you want this to feel more casual or more customer-support style?

[10:02] Human:
Let’s go with casual but still professional.

[10:02] Chatbot:
Perfect 👍 What would you like to test first — small talk, FAQs, or a problem-solving scenario?

[10:03] Human:
Let’s pretend I’m a customer who has an issue with an order.

[10:03] Chatbot:
Sounds good.
Hi! Thanks for reaching out. Can you tell me a bit more about the issue with your order?

[10:04] Human:
Yeah, my package was supposed to arrive yesterday, but I haven’t received anything yet.

[10:04] Chatbot:
Sorry about that — I know delays can be frustrating. Let me check on that for you. Do you have your order number handy?

[10:05] Human:
Yep, it’s ORD-45821.

[10:05] Chatbot:
Thanks! Give me a moment while I look that up 👀

[10:06] Chatbot:
Alright, I see your order here. It looks like it was delayed due to a courier issue and is now scheduled to arrive tomorrow.

[10:06] Human:
Ah okay. Will I get a notification when it’s out for delivery?

[10:07] Chatbot:
Yes, you will 👍 You’ll receive both an email and a text message once it’s out for delivery.

[10:07] Human:
Cool. Is there anything I need to do on my end?

[10:08] Chatbot:
Nope, you’re all set. Just keep an eye out for the notification. If it doesn’t arrive by tomorrow evening, feel free to come back and I’ll escalate it for you.

[10:08] Human:
Sounds good. Thanks for the help!

[10:09] Chatbot:
You’re very welcome 😊 Before you go, is there anything else I can help you with today?

[10:09] Human:
Nope, that’s all.

[10:10] Chatbot:
Alright! Thanks for chatting with me. Hope the rest of your day goes great 👋`


function searchTranscript(chat, keyword) {
  return chat
    .split('\n')
    .filter(line =>
      line.toLowerCase().includes(keyword.toLowerCase())
    );
}

// Example usage
const results = searchTranscript(chat, 'delayed');
console.log(results);