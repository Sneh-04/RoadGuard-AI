const Card = ({ children, className = '', hover = true }) => {
  return (
    <div
      className={`bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 ${
        hover ? 'hover:scale-105 hover:shadow-lg hover:shadow-primary/50 transition-all duration-300' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;