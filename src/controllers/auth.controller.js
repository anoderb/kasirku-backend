const authService = require('../services/auth.service');
const { successRes, errorRes } = require('../utils/response');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return errorRes(res, 'Username dan password wajib diisi', 400);
    }

    const result = await authService.login(username, password);
    return successRes(res, result, 'Login berhasil');
  } catch (err) {
    return errorRes(res, err.message, 401);
  }
};

exports.initOwner = async (req, res) => {
  try {
    const { name, username, password } = req.body;

    if (!username || !password) {
      return errorRes(res, 'Username dan password wajib diisi', 400);
    }

    const owner = await authService.registerInitialOwner({ name, username, password });
    
    // Auto login after init
    const loginResult = await authService.login(username, password);
    return successRes(res, loginResult, 'Inisialisasi Owner berhasil', 201);
  } catch (err) {
    return errorRes(res, err.message, 400);
  }
};
