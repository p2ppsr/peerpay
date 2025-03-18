interface Constants {
  confederacyURL: string
  messageboxURL: string
}

let constants: Constants

if (
  window.location.host.startsWith("localhost")
  || window.location.host.startsWith("staging")
  || process.env.NODE_ENV === "development"
) {
  // Local / Staging environment
  constants = {
    confederacyURL: "https://staging-confederacy.babbage.systems",
    messageboxURL: 'https://staging-messagebox.babbage.systems'
  }
} else {
  // Production environment
  constants = {
    confederacyURL: 'https://confederacy.babbage.systems',
    messageboxURL: 'https://messagebox.babbage.systems'
  }
}

export default constants
