<?php
// Set your desired email and password
$email = "tattoo@admin.com";
$password = "inkspire123";

// Generate hash
$hash = password_hash($password, PASSWORD_BCRYPT);

echo "Email: " . $email . "<br>";
echo "Password: " . $password . "<br>";
echo "Hash: " . $hash . "<br>";

// You can add database insert code here if you want
// For now, just use this information to manually add to your database
?>