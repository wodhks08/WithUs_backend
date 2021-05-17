const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const db = require('../config/database.js');
const conn = db.init();

router.post('/join', function(req, res, next) { // 회원가입 라우터

  console.log(req.body);

  var Originalpassword = req.body.User_password;

  bcrypt.genSalt(saltRounds, function(err, salt) {
    if(err) return res.status(400).json({SignUp : false, message : "password encoding error"});
    bcrypt.hash(Originalpassword, salt, function(err, hash) {
        if(err) return res.status(400).json({SignUp : false, message : "password encoding error"});
        else {
          var sql = "Insert into User (User_id, User_name, User_university, User_gender, User_phone, User_nickname, User_major, User_area, User_certificate, User_introduction, User_password) values (?,?,?,?,?,?,?,?,?,?,?)";
          var params = [req.body.User_id, req.body.User_name, req.body.User_university, req.body.User_gender, req.body.User_phone, req.body.User_nickname, req.body.User_major, req.body.User_area, req.body.User_certificate, req.body.User_introduction, hash];
          conn.query(sql, params, function (err, rows, fields) {
            if(err) return res.status(400).json({SignUp : false});
            else {
              return res.status(200).json({SignUp : true});
            };
          });
        }
    });
  });
});

router.post('/modify', (req, res, next) => { // 마이페이지 회원정보 변경 (아이디, 이름, 성별은 변경 불가능)
      console.log(req.body);
      var sql = "Update User set User_name = ?, User_phone = ?, User_university = ?, User_nickname = ?, User_area = ?, User_major = ?, User_certificate = ?, User_introduction = ? where User_code = ?";
      var params = [req.body.User_name, req.body.User_phone, req.body.User_university, req.body.User_nickname, req.body.User_area, req.body.User_major, req.body.User_certificate, req.body.User_introduction, req.body.User_code];
      conn.query(sql, params, function (err, rows, fields) {
        if(err) return res.status(400).json({modify : false, message : "modify error!"});
        else {
          var selectrows = "SELECT User_code, User_name, User_university, User_nickname, User_phone, User_major, User_area, User_certificate, User_introduction from User where User_code = ?"
          conn.query(selectrows, req.body.User_code, function (err, rows, fields) {
            if(err) return res.status(400).json({modify : true, select : false, message : "select query error"});
            else {
              return res.status(200).json({modify : true, select : true, message : "modify success", modifyuser : rows[0]});
            };
          });

          // return res.status(400).json({select : false, message : "select query error"});
        };
      });
})

router.post('/Interest', (req, res, next) => {
  console.log(req.body);
  // var sql = "update Interest set User_code = ?, ScienceEnginnering = ?, ScienceEnginnering = ?, Environment = ?, Employment = ?, Art = ?, Academic = ?, Idea = ?, UCC = ?, culture = ?, Design = ?, Slogan = ?, Economy = ?"
  var params = [req.body.User_code, req.body.ScienceEnginnering, req.body.ContentsWebtoon, req.body.Environment, req.body.Employment, req.body.Art, req.body.Academic, req.body.Idea, req.body.UCC, req.body.culture, req.body.Design, req.body.Slogan, req.body.Economy];
  conn.query(sql, params, function (err, rows, fields) {
    if(err) return res.status(400).json({Interest: false,  message : "Interest add error"});
    else {
      return res.status(200).json({Interest : true, message : "Interest add success"});
    };
  });
})

router.post('/Quit', (req, res, next) => {
  console.log(req.body);

  var getPassword = "select User_password from User where User_code = ?";
  conn.query(getPassword, req.body.User_code, async function(err, rows, fields) {
    if(err) return res.status(400).json({selectPassword : false, message : "query error"});
    else {
      const result = await bcrypt.compare(req.body.User_password, rows[0].User_password);
      if(result) {
        var sql = "delete from User where User_code = ?";
        var params = [req.body.User_code];
        conn.query(sql, params, function(err, rows, fields) {
          if(err) return res.status(400).json({quit : false, message : "query error"});
          else {
            return res.status(200).json({quit : true, message : "quit success"});
          }
        })
      } else {
        return res.status(400).json({quit : false, message : "비밀번호가 틀렸습니다."});
      }
    }
  })
})

router.post('/modifyPassword', (req, res) => {
  var getPassword = "select User_password from User where User_code = ?";
  conn.query(getPassword, req.body.User_code, async function(err, rows, fields) {
    if(err) return res.status(400).json({selectPassword : false, message : "query error"});
    else {
      //User_current_password가 현재 DB비밀번호와 일치하는지 확인
      console.log("여기까지 확인");
      const result = await bcrypt.compare(req.body.User_current_password, rows[0].User_password);
      if(result) {
        //일치한다면 바꾸려고하는 비밀번호(User_password)를 암호화
        bcrypt.genSalt(saltRounds, function(err, salt) {
          if(err) return res.status(400).json({modify : false, message : "비밀번호 암호화 실패"});
          bcrypt.hash(req.body.User_password, salt, function(err, hash) {
            if(err) return res.status(400).json({modify : false, message : "비밀번호 암호화 실패"});
            else {
              var sql = "update User set User_password = ? where User_code = ?";
              var params = [hash, req.body.User_code];
              conn.query(sql, params, function(err, rows, fields) {
                if(err) return res.status(400).json({modify : false, message : "암호화한 코드 삽입 실패"});
                else {
                  return res.status(200).json({modify : true, message : "modify success"});
                }
              })
            }
          })
        })
      } else {
        //아니면 error 출력
        console.log("의심부분");
        return res.status(200).json({modify : false, message : "현재 비밀번호가 틀렸습니다."});
      }
    }
  })
})

module.exports = router;