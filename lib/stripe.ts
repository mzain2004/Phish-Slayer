import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2023-10-16', // Ensure you test with this verison
  appInfo: {
    name: 'Phish-Slayer',
    version: '0.1.0'
  }
})
