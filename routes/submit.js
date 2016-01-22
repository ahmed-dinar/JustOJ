orm.in('user_solved_list').insertUnique({
    uid: '2',
    pid: '5',
    where: {
        $and: {
            uid: '2',
            pid: '5'
        }
    }
},function(err,result){
    if( err ) { return next(err); }
});
