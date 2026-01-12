#!/usr/bin/expect -f

set host "194.177.1.240"
set port 6666
set user "dima"
set password "Dima@1203"
set timeout 30
set identity_file "$env(HOME)/.ssh/id_ed25519_dev.pub"

puts "🔑 Attempting to copy SSH ID to $user@$host:$port..."

# Read public key
set fp [open $identity_file r]
set key_content [read $fp]
close $fp

spawn ssh -o StrictHostKeyChecking=no -p $port $user@$host "mkdir -p ~/.ssh && echo '$key_content' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh"

expect {
    "password:" {
        send "$password\r"
        exp_continue
    }
    "Permission denied" {
        puts "\n❌ Wrong password or permission denied."
        exit 1
    }
    eof {
        puts "\n✅ ID copied successfully! You should now be able to login without a password."
    }
}
