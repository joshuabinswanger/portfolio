import PhotoSwipeLightbox from "photoswipe/lightbox";

type CaptionData = {
  description_title?: string | null;
  description_text?: string | null;
  link?: string | null;
};

type CaptionLightbox = InstanceType<typeof PhotoSwipeLightbox>;

function buildCaptionHTML(data?: CaptionData) {
  if (!data?.description_title) {
    return "";
  }

  const link = data.link
    ? `<p><a href="${data.link}">External Link</a></p>`
    : "";

  return `
    <p><strong>${data.description_title}</strong></p>
    <p>${data.description_text ?? ""}</p>
    ${link}
  `;
}

export function registerPhotoSwipeCaption(
  lightbox: CaptionLightbox,
  placeholder = "Caption text",
) {
  lightbox.on("uiRegister", () => {
    lightbox.pswp.ui.registerElement({
      name: "custom-caption",
      order: 9,
      isButton: false,
      appendTo: "wrapper",
      html: placeholder,
      onInit: (element, pswp) => {
        lightbox.pswp.on("change", () => {
          element.innerHTML = buildCaptionHTML(
            pswp.currSlide?.data as CaptionData | undefined,
          );
        });
      },
    });
  });
}
