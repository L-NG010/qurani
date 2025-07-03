<?php

namespace App\Models\LinkID;

use Illuminate\Database\Eloquent\Model;

class SettingGrup extends Model
{
    protected $table = 'qu_setting_group';
    protected $primaryKey = 'group_id';
    protected $connection = 'linkid';
}
