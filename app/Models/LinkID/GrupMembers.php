<?php

namespace App\Models\LinkID;

use Illuminate\Database\Eloquent\Model;

class GrupMembers extends Model
{
    protected $table = 'qu_setting_global';
    protected $primaryKey = 'global_id';
    protected $connection = 'linkid';
}
