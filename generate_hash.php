<?php
$password = 'password123'; // Change this to your desired password
$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
echo "Password: $password\n";
echo "Hash: $hash\n";
?>