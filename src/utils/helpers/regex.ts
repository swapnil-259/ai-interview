const regex = {
  PHONE: /(\+?\d{1,3}[\s-]?)?(\(?\d{2,4}\)?[\s-]?)?\d{6,10}/,
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i
};

export default regex;
