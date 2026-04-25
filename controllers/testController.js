const getTest = (req, res) => {
  res.status(200).send("Server running");
};

module.exports = {
  getTest
};
