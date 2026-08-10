export async function getManyChatInteractions(phone: string) {
  const response = await fetch(
    `https://api.manychat.com/fb/subscriber/getSubscriberByPhone?phone=${phone}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.MANYCHAT_API_TOKEN}`,
      },
    }
  )

  return response.json()
}