exports.log = function () {
  if (process.env.LOGGING === 'TRUE') console.log(arguments);
};

exports.sleep = function (miliseconds = 1000) {
  return new Promise(resolve => setTimeout(() => resolve(), miliseconds))
};
