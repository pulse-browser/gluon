export const internalMozconfg = (brand: string) => `
# =====================
# Internal gluon config
# =====================

# Custom branding
ac_add_options --with-branding=browser/branding/${brand}

# Config for updates
ac_add_options --disable-verify-mar
ac_add_options --enable-update-channel=${brand}
`
