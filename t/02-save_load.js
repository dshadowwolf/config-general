var tap = require('tap'),
    plan = tap.plan,
    test = tap.test,
    parser = require('../index');

var t8conf1 = new parser.parser("cfg.8");
var base_data = t8conf1.getall();
t8conf1.save_file("cfg.out");
var t8conf2 = new parser.parser("cfg.out");
var data_copy = t8conf2.getall();

test("saving configs and heredoc processing", function(t) {
  t.plan(2);
  t.isDeeply(base_data,data_copy,"Writing Config Hash to disk and compare with original");
  t.like(data_copy.nocomment, /this should appear/, "C-comments not processed in here-doc" );
  t.end();
});
