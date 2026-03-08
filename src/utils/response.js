/**
 * Wrapper helper format standard response API
 */

exports.successRes = (res, data, message = 'Berhasil', statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message,
    data
  };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

exports.errorRes = (res, message = 'Terjadi kesalahan internal server', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  };
  
  if (errors) response.errors = errors;

  return res.status(statusCode).json(response);
};
