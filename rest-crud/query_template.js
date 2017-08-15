module.exports = {
    selectList: 'SELECT * FROM t_user',
    selectUser: 'SELECT * FROM t_user WHERE user_id = ? ',
    insert : 'INSERT INTO t_user set ? ',
    update: 'UPDATE t_user set ? WHERE user_id = ? ',
    delete: 'DELETE FROM t_user  WHERE user_id = ? '
};