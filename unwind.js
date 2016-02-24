var _ = require('lodash');
var readline = require('readline');


var unwind = function(exp, env) {
    if (isVariable_(exp)) {
        return env[exp];

    } else if (isSelfEvaluating_(exp)) {
        return exp;

    } else if (isDefinition_(exp)) {
        return define_(exp, env);

    } else if (isIf_(exp)) {
        return unwindIf_(exp, env);

    } else if (isLambda_(exp)) {
        return makeProcedure_(exp, env);

    } else {
        var args = _.map(operands_(exp), function(subexp) {
            return unwind(subexp, env);
        });

        return apply(unwind(operator_(exp), env), args, env);
    }
};


var apply = function(proc, args, env) {
    if (isPrimitiveProcedure(proc)) {
        return proc.apply(null, args);
    } else {
        var params = proc[1];
        var body = proc[2];
        var newEnv = _.merge(env, createObj_(params, args));

        return unwind(body, newEnv);
    }
};


var isPrimitiveProcedure = _.isFunction;


var isVariable_ = _.isString;


var isSelfEvaluating_ = _.isNumber;


var isDefinition_ = function(exp) {
    return _.head(exp) == 'define';
}

var isIf_ = function(exp) {
    return _.head(exp) == 'if';
}


var isLambda_ = function(exp) {
    return _.head(exp) == 'lambda';
}


var parse = function(program) {
    var tokens = tokenize_(program);
    return _.head(parse_(tokens));
};


var tokenize_ = function(program) {
    var tokens =  replaceAll(replaceAll(program, '(', ' ( '), ')', ' ) ').split(' ');
    return _.filter(tokens, _.identity); // Remove empty strings
};


var define_ = function(exp, env) {
    var key = exp[1];
    var value = unwind(exp[2], env);

    env[key] = value;
};


var unwindIf_ = function(exp, env) {
    var condition = exp[1];
    var consequence = exp[2];
    var alternate = exp[3]

    if (unwind(condition, env)) {
        return unwind(consequence, env);
    } else {
        return unwind(alternate, env);
    }
};


var operator_ = _.head;


var operands_ = _.tail;


var makeProcedure_ = function(exp, env) {
    var params = exp[1];
    var body = exp[2];
    return ['procedure', params, body, env];
};


var parse_ = function(tokens, i) {
    i = i || 0;
    var result = [];

    if (tokens[i] == '(') {
        i++;
        while (tokens[i] != ')') {
            var token = tokens[i];

            if (token == '(') {
                var subresult = parse_(tokens, i);
                result.push(subresult[0]);
                i = subresult[1];
            } else {
                result.push(primitive_(token));
            }
            i++;
        }
        return [result, i];

    } else {
        return [primitive_(tokens[i]), i];
    }
};


var primitive_ = function(token) {
    return isNaN(token)? token : +token;
};


var replaceAll = function(target, search, replacement) {
    return target.split(search).join(replacement);
};


var createObj_ = function(keys, values) {
    var result = {};
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = values[i];

        result[key] = value;
    }
    return result;
};


var getStandardEnv = function() {
    return {
        '+': function(a, b) { return a + b; },
        '-': function(a, b) { return a - b; },
        '*': function(a, b) { return a * b; },
        '/': function(a, b) { return a / b; },
        '=': function(a, b) { return a === b; },
        'cons': function(a, b) { return _.union([a], b); },
        'car': _.head,
        'cdr': _.tail,
        'map': _.map
    };
};


var repl = function() {
    var rl = readline.createInterface(process.stdin, process.stdout);
    var env = getStandardEnv();

    rl.setPrompt('> ');
    rl.prompt();

    rl.on('line', function(line) {

        var val = unwind(parse(line), env);
        if (!_.isUndefined(val)) {
            console.log(val);
        }

        rl.prompt();
    }).on('close',function(){
        process.exit(0);
    });

}

repl();
