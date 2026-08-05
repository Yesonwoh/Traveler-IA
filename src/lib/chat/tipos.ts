export type RecomendacionDTO = {
  id: string;
  tipo: string;
  nombre: string;
  direccion: string | null;
  opinion: string | null;
  lat: number | null;
  lng: number | null;
  countryCode: string | null;
  fotosUrls: string[];
  /**
   * Si hay un programa de afiliación real detrás de este sitio, o no. Se decide en el
   * servidor porque depende de variables de entorno que el cliente no ve. Sin esto, la
   * tarjeta ofrecía "Reservar" para cosas que nadie vende (un bus interurbano) y el
   * botón acababa en una búsqueda de Google.
   */
  tieneProveedor?: boolean;
};

export type MensajeDTO = {
  id: string;
  texto: string;
  esIA: boolean;
  createdAt: string;
  recomendaciones: RecomendacionDTO[];
};
