function capitalize(str) {
  return str
    ? str
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "";
}

module.exports = capitalize;
