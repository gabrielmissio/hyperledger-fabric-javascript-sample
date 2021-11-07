class KeysGenarator {
  static Genarate() {
    // TODO: implement logic for key pair creation

    const random = `${Math.floor(Math.random() * 10) + 1}-${Date.now()}`
    return {
      publicKey: random,
      privateKey: `${random}-pk`,
    };
  }
}

module.exports = KeysGenarator;
