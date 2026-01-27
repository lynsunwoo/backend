// =====================
// 1. 기본 express 설정
// =====================
const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 9070;
const SECRET_KEY = 'test';

// =====================
// 2. 미들웨어
// =====================
app.use(cors());
app.use(express.json());

// =====================
// 3. MySQL(DB) 연결 설정
// =====================
const connection = mysql.createConnection({
  host: 'database',
  user: 'root',
  password: '1234',
  database: 'kdt',
  port: 3306
});

// =====================
// 4. DB 접속 확인
// =====================
connection.connect((err) => {
  if (err) {
    console.error('MySQL 연결 실패:', err);
    return;
  }
  console.log('MySQL DB 연결 성공');
});

// =====================
// 5. 서버 실행
// =====================
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

//4. 회원가입용 API (테스트용) - Resister.js에서 넘겨 받은 username, password를 sql db에 입력하여 추가한다.
app.post('/join', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10); //패스워드 hash암호화

  connection.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], (err) => {

    //if (err) return res.status(500).json({ error: '회원가입 실패' });
    //또는 

    if (err) {
      if (err.code == 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: '이미 존재하는 아이디입니다.' });
      }
      return res.status(500).json({ error: '회원가입 실패' });
    }

    res.json({ success: true });
  });
});

//회원가입 회원 수 반환
app.get('/user-count', (req, res) => {
  const sql = 'SELECT COUNT(*) AS count FROM users';

  connection.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'DB 오류' });
    res.json({ count: results[0].count });
  });
});


//3. 로그인 API : 로그인 폼에서 post방식으로 전달받은 데이터(id, pw)를 DB에 조회하여 결과값을 리턴함.
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, result) => {
    if (err || result.length === 0) {
      return res.status(401).json({
        error: '아이디 또는 비밀번호가 틀렸습니다.'
      });
    }

    const user = result[0];//조회된 첫번째 사용자 데이터

    //사용자가 입력한 pw, db에 있는 pw비교
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 틀렸습니다.' });
    }

    //토큰 생성(1시간)
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });

    //토큰 발급
    res.json({ token });
  });
});

// ======================================================
// 6. GET (조회)
// ======================================================

// goods 조회
app.get('/goods', (req, res) => {
  connection.query('SELECT * FROM goods', (err, results) => {
    if (err) {
      console.error('쿼리 오류:', err);
      return res.status(500).json({ error: 'DB 쿼리 오류' });
    }
    res.json(results);
  });
});

// fruit 조회
app.get('/fruit', (req, res) => {
  connection.query('SELECT * FROM fruit', (err, results) => {
    if (err) {
      console.error('쿼리 오류:', err);
      return res.status(500).json({ error: 'DB 쿼리 오류' });
    }
    res.json(results);
  });
});

// noodle 조회
app.get('/noodle', (req, res) => {
  connection.query('SELECT * FROM noodle', (err, results) => {
    if (err) {
      console.error('쿼리 오류:', err);
      return res.status(500).json({ error: 'DB 쿼리 오류' });
    }
    res.json(results);
  });
});

// books 조회
app.get('/books', (req, res) => {
  connection.query('SELECT * FROM books', (err, results) => {
    if (err) {
      console.error('쿼리 오류:', err);
      return res.status(500).json({ error: 'DB 쿼리 오류' });
    }
    res.json(results);
  });
});

// customer 조회
app.get('/customer', (req, res) => {
  connection.query('SELECT * FROM customer', (err, results) => {
    if (err) {
      console.error('쿼리 오류:', err);
      return res.status(500).json({ error: 'DB 쿼리 오류' });
    }
    res.json(results);
  });
});

//question 조회하여 QUSETION LIST 에 출력
app.get('/api/question', (req, res) => {
  connection.query('SELECT * FROM question ORDER BY question.id DESC', (err, results) => {
    if (err) {
      console.error('쿼리 오류 :', err);
      return res.status(500).json({ error: 'DB 쿼리 오류' });
    }
    res.json(results);
  });
});

// ======================================================
// 7. POST (등록)
// ======================================================
app.post('/goods', (req, res) => {
  const { g_name, g_cost } = req.body;

  if (!g_name || !g_cost) {
    return res.status(400).json({ error: '필수 항목 누락' });
  }

  connection.query(
    'INSERT INTO goods (g_name, g_cost) VALUES (?, ?)',
    [g_name, g_cost],
    (err, result) => {
      if (err) {
        console.error('등록 오류:', err);
        return res.status(500).json({ error: '상품 등록 실패' });
      }
      res.json({ success: true, insertId: result.insertId });
    }
  );
});
//fruit 데이터 입력을 위한 내용
app.post('/fruit', (req, res) => {
  const { name, price, color, country } = req.body;

  if (!name || !price || !color || !country) { //정보가 없다면,
    return res.status(400).json({ error: '필수 항목이 누락되었습니다. 다시 확인하세요' });
  }
  //input 쿼리문 작성
  connection.query(
    'INSERT INTO fruit (name, price, color, country) VALUES (?, ?, ?, ?)',
    [name, price, color, country], (err, result) => {
      if (err) {
        console.log('등록오류', err);
        res.status(500).json({ error: '상품등록 실패' });
        return;
      }
      res.json({ success: true, insertId: result.insertId });
    }
  );
});

//noodle 데이터 입력을 위한 내용
app.post('/noodle', (req, res) => {
  const { name, company, kind, price, e_date } = req.body;

  if (!name || !company || !kind || !price || !e_date) {
    return res.status(400).json({ error: '필수 항목이 누락되었습니다. 다시 확인하세요' });
  }
  connection.query(
    'INSERT INTO noodle (name, company, kind, price, e_date) VALUES (?, ?, ?, ?, ?)', [name, company, kind, price, e_date], (err, result) => {
      if (err) {
        console.log('등록오류', err);
        res.status(500).json({ error: '상품등록실패' });
        return;
      }
      res.json({ success: true, insertId: result.insertId });
    }
  );
});

//books 데이터 입력을 위한 내용
app.post('/books', (req, res) => {
  const { name, area1, area2, area3, book_cnt, owner_nm, tel_num } = req.body;
  if (!name || !area1 || !area2 || !area3 || !book_cnt || !owner_nm || !tel_num) {
    //정보가 없다면
    return res.status(400).json({ error: '필수 항목이 누락되었습니다. ' });
  }
  //쿼리문 작성
  connection.query('INSERT INTO books (name, area1, area2, area3, book_cnt, owner_nm, tel_num) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, area1, area2, area3, book_cnt, owner_nm, tel_num], (err, result) => {
    if (err) {
      console.log('등록오류', err);
      res.status(500).json({ error: '상품등록 실패' });
      return;
    }
    res.json({ success: true, insertId: result.insertId });
  }
  );
});

//customer 데이터 입력을 위한 내용
app.post('/customer', (req, res) => {
  const { c_name, c_address, c_tel } = req.body;
  //유효성 검사 생략
  //쿼리문 작성
  connection.query('INSERT INTO customer (c_name, c_address, c_tel) VALUES (?, ?, ?)', [c_name, c_address, c_tel], (err, result) => {
    if (err) {
      console.log('등록오류', err);
      res.status(500).json({ error: '상품등록 실패' });
      return;
    }
    res.json({ success: true, insertId: result.insertId })
  })
})

//question 데이터 입력을 위한 내용
app.post('/api/question', (req, res) => {
  const { name, phone, email, content } = req.body;
  if (!name || !phone || !email || !content) {
    return res.status(400).json({ error: '필수 항목이 누락되었습니다. ' });
  }
  //쿼리문 작성
  connection.query(`INSERT INTO question (name, phone, email, content) VALUES (?, ?, ?, ?)`, [name, phone, email, content], (err, result) => {
    if (err) {
      console.log('등록오류', err);
      res.status(500).json({ error: '문의 등록 실패' });
      return;
    }
    res.json({ success: true, insertId: result.insertId });
    // res.send('질문 등록 완료'); 단순한 버전
  }
  );
});

// ======================================================
// 8. DELETE (삭제)
// ======================================================
app.delete('/goods/:g_code', (req, res) => {
  const g_code = req.params.g_code;

  connection.query(
    'DELETE FROM goods WHERE g_code = ?',
    [g_code],
    (err) => {
      if (err) {
        console.error('삭제 오류:', err);
        return res.status(500).json({ error: '상품 삭제 실패' });
      }
      res.json({ success: true });
    }
  );
});
//fruit 삭제를 위한 내용
app.delete('/fruit/:num', (req, res) => { //:g_code (백앤드에서 params를 받을떄 앞에 : 붙인다.)
  const num = req.params.num;
  //delete 쿼리문 작성
  connection.query(
    'DELETE FROM fruit WHERE num = ?',
    [num],
    (err, result) => {
      if (err) {
        console.log('삭제오류:', err);
        res.status(500).json({ error: '상품 삭제 실패' });
        return;
      }
      res.json({ success: true });
    }
  );
});

//noodle 삭제를 위한 내용
app.delete(`/noodle/:num`, (req, res) => {
  const num = req.params.num;
  //delete 쿼리문 작성
  connection.query('DELETE FROM noodle WHERE num =?', [num],
    (err, result) => {
      if (err) {
        console.log('삭제오류:', err);
        res.status(500).json({ error: '상품 삭제 실패' });
        return;
      }
      res.json({ success: true });
    }
  );
});

//books 삭제를 위한 내용
app.delete(`/books/:num`, (req, res) => {
  const num = req.params.num;
  connection.query('DELETE FROM books WHERE num =?', [num],
    (err, result) => {
      if (err) {
        console.log('삭제오류 :', err);
        res.status(500).json({ error: '상품 삭제 실패' });
        return;
      }
      res.json({ success: true });
    }
  );
});

//customer 삭제를 위한 내용
app.delete(`/customer/:id`, (req, res) => {
  const id = req.params.id;
  connection.query('DELETE FROM customer WHERE id = ?', [id],
    (err, result) => {
      if (err) {
        console.log('삭제오류 :', err);
        res.status(500).json({ error: '상품 삭제 실패' });
        return;
      }
      res.json({ success: true });
    }
  );
});


// ======================================================
// 9. GET (단일 조회)
// ======================================================
app.get('/goods/:g_code', (req, res) => {
  const g_code = req.params.g_code;

  connection.query(
    'SELECT * FROM goods WHERE g_code = ?',
    [g_code],
    (err, results) => {
      if (err) {
        console.error('조회 오류:', err);
        return res.status(500).json({ error: '상품 조회 실패' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: '해당 상품 없음' });
      }

      res.json(results[0]);
    }
  );
});

//fruit 수정을 위해 상품 조회 먼저
app.get('/fruit/:num', (req, res) => {
  const num = req.params.num;

  connection.query(
    'SELECT * FROM fruit WHERE num = ?',
    [num],
    (err, results) => {
      if (err) {
        console.log('조회오류:', err);
        res.status(500).json({ error: '해당 상품이 없습니다.' });
        return;
      }
      // if (results.length == 0) {
      //   res.status(404).json({ error: '해당상품이 존재하지 않습니다.' });
      // }
      res.json(results[0]); // 단일 객체만 반환
    }
  );
});

//noodle 수정을 위해 상품 조회 먼저
app.get('/noodle/:num', (req, res) => {
  const num = req.params.num;

  connection.query(
    'SELECT * FROM noodle WHERE num = ?',
    [num],
    (err, results) => {
      if (err) {
        console.log('조회오류 :', err);
        res.status(500).json({ error: '해당 상품이 없습니다.' });
        return;
      }

      res.json(results[0]) //results()배열 말고 하나의 객체값만 반환하여 수정
    }
  );
});

//books 수정을 위해 상품 조회 먼저
app.get('/books/:num', (req, res) => {
  const num = req.params.num;

  connection.query(
    'SELECT * FROM books WHERE num = ?',
    [num],
    (err, results) => {
      if (err) {
        console.log('조회오류 :', err);
        res.status(500).json({ error: '해당 상품이 없습니다.' });
        return;
      }
      res.json(results[0])
    }
  );
});


// ======================================================
// 10. PUT (수정)
// ======================================================
app.put('/goods/goodsupdate/:g_code', (req, res) => {
  const g_code = req.params.g_code;
  const { g_name, g_cost } = req.body;

  connection.query(
    'UPDATE goods SET g_name = ?, g_cost = ? WHERE g_code = ?',
    [g_name, g_cost, g_code],
    (err) => {
      if (err) {
        console.error('수정 오류:', err);
        return res.status(500).json({ error: '상품 수정 실패' });
      }
      res.json({ success: true });
    }
  );
});

//fruit 수정을 위한 내용
app.put(`/fruit/fruitupdate/:num`, (req, res) => {
  const num = req.params.num;
  const { name, price, color, country } = req.body;
  connection.query(
    'UPDATE fruit SET name =?, price =?, color =?, country =? WHERE num =?',
    [name, price, color, country, num],
    (err, result) => {
      if (err) {
        console.log('수정 오류 :', err);
        res.status(500).json({ error: '상품 수정 실패' });
        return;
      }
      res.json({ success: true });
    }
  );
});

//noodle 수정을 위한 내용
app.put(`/noodle/noodleupdate/:num`, (req, res) => {
  const num = req.params.num;
  const { name, company, kind, price, e_date } = req.body;
  connection.query(
    'UPDATE noodle SET name = ?, company = ?, kind = ?, price = ?, e_date = ? WHERE num =?',
    [name, company, kind, price, e_date, num],
    (err, result) => {
      if (err) {
        console.log('수정 오류 :', err);
        res.status(500).json({ error: '상품 수정 실패' });
        return;
      }
      res.json({ success: true });
    }
  );
});

//books 수정을 위한 내용
app.put(`/books/booksupdate/:num`, (req, res) => {
  const num = req.params.num;
  const { name, area1, area2, area3, book_cnt, owner_nm, tel_num } = req.body;
  connection.query(
    'UPDATE books SET name = ?, area1 = ?, area2 = ?, area3 = ?, book_cnt = ?, owner_nm = ?, tel_num = ? WHERE num = ?',
    [name, area1, area2, area3, book_cnt, owner_nm, tel_num, num],
    (err, result) => {
      if (err) {
        console.log('수정 오류 :', err);
        res.status(500).json({ error: '상품수정 실패' });
        return;
      }
      res.json({ success: true });
    }
  )
})


