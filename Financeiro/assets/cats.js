// cats.js — 4 gatos fidelíssimos à imagem de referência
// Pose 1 (de lado, olhando pra cima) = ALERTA  → logo também
// Pose 2 (de frente, olhos semifechados) = FELIZ
// Pose 3 (de frente, olhos abertos/marcantes) = OK
// Pose 4 (de lado, olhando pra frente) = BRAVO
// Sem animação, sem fundo, traço fino minimalista, stroke="currentColor"

window.CatSVG = {
  alerta: `<img src="assets/Alerta.png" .../>`,
  feliz:  `<img src="assets/Feliz.png"  .../>`,
  ok:     `<img src="assets/ok.png"     .../>`,
  bravo:  `<img src="assets/Bravo.png"  .../>`,
};

// Logo = pose 1 (alerta), que também é o gato de perfil olhando pra cima
window.CatSVG.logo = window.CatSVG.alerta;

// Injeta o SVG do humor em todos os .fincat-mood
window.setCatMood = function(mood) {
  const svg = CatSVG[mood] || CatSVG.ok;
  document.querySelectorAll('.fincat-mood').forEach(el => el.innerHTML = svg);
};

// Injeta a logo em todos os .fincat-logo
window.setLogocat = function() {
  document.querySelectorAll('.fincat-logo').forEach(el => el.innerHTML = CatSVG.logo);
};
