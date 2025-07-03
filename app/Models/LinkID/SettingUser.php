<?php

namespace App\Models\LinkID;

use Illuminate\Database\Eloquent\Model;

class SettingUser extends Model
{
    protected $table = 'qu_setting_user';
    protected $primaryKey = 'user_id';
    protected $connection = 'linkid';
}
