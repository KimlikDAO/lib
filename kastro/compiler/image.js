

const Image = ({ src, inline }) => {
  console.log(src, inline);
  return <img src={src} data-inline={inline} />;
};

export { Image };
