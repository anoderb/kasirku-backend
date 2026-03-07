/**
 * Wrapper helper format standard response API
 */

exports.successRes = (res, data, message = 'Berhasil', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

exports.errorRes = (res, message = 'Terjadi kesalahan internal server', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  };
  
  if (errors) response.errors = errors;

  return res.status(statusCode).json(response);
};
