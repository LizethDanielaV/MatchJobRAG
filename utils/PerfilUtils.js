function construirTextoPerfilUsuario({ genero, edad, estudios, orientacion, experiencia, habilidades }) {
  const generoTexto = { masculino: "hombre", femenino: "mujer" }[genero] ?? "persona";
  const habilidadesTexto = Array.isArray(habilidades) ? habilidades.join(", ") : habilidades;

  return (
    `Analiza qué tipo de vacantes se ajustan a una persona de ${edad} años, ${generoTexto}, ` +
    `con estudios en ${estudios}. ` +
    `Su orientación dentro de Ingeniería de Sistemas es hacia ${orientacion}. ` +
    `Experiencia previa: ${experiencia}. ` +
    `Tecnologías y habilidades que maneja: ${habilidadesTexto}.`
  );
}

function construirTextoBusqueda({ area, nivel, habilidades, resumenBusqueda }) {
  const habilidadesTexto = Array.isArray(habilidades) ? habilidades.join(", ") : habilidades;

  return (
    `Vacante orientada a perfil ${nivel} en el área de ${area}. ` +
    `Requiere conocimientos en: ${habilidadesTexto}. ` +
    `${resumenBusqueda}`
  );
}

export { construirTextoPerfilUsuario, construirTextoBusqueda };
