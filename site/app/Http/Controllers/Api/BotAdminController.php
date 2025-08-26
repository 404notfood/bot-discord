<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class BotAdminController extends Controller
{
    /**
     * Get all bot administrators
     */
    public function index()
    {
        try {
            $admins = DB::table('bot_admins')
                ->select(['id', 'user_id', 'username', 'added_at', 'added_by', 'is_active'])
                ->where('is_active', 1)
                ->orderBy('added_at', 'desc')
                ->get()
                ->map(function ($admin) {
                    return [
                        'id' => $admin->id,
                        'user_id' => $admin->user_id,
                        'username' => $admin->username,
                        'added_at' => $admin->added_at,
                        'added_by' => $admin->added_by,
                        'status' => $admin->is_active ? 'active' : 'inactive'
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $admins
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching bot admins:', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch administrators',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add a new bot administrator
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|string|max:20',
            'username' => 'required|string|max:32',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if admin already exists
            $existingAdmin = DB::table('bot_admins')
                ->where('user_id', $request->user_id)
                ->where('is_active', 1)
                ->first();

            if ($existingAdmin) {
                return response()->json([
                    'success' => false,
                    'error' => 'Administrator already exists',
                    'message' => 'This user is already an administrator'
                ], 409);
            }

            // Insert new admin
            $adminId = DB::table('bot_admins')->insertGetId([
                'user_id' => $request->user_id,
                'username' => $request->username,
                'added_at' => now(),
                'added_by' => 'dashboard', // Could be auth user in the future
                'is_active' => 1
            ]);

            $newAdmin = DB::table('bot_admins')
                ->where('id', $adminId)
                ->first();

            Log::info('Bot admin added successfully', [
                'user_id' => $request->user_id,
                'username' => $request->username,
                'added_by' => 'dashboard'
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $newAdmin->id,
                    'user_id' => $newAdmin->user_id,
                    'username' => $newAdmin->username,
                    'added_at' => $newAdmin->added_at,
                    'added_by' => $newAdmin->added_by,
                    'status' => 'active'
                ],
                'message' => 'Administrator added successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error adding bot admin:', [
                'error' => $e->getMessage(),
                'user_id' => $request->user_id,
                'username' => $request->username
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to add administrator',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove a bot administrator
     */
    public function destroy($id)
    {
        try {
            $admin = DB::table('bot_admins')
                ->where('id', $id)
                ->where('is_active', 1)
                ->first();

            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'error' => 'Administrator not found',
                    'message' => 'The specified administrator does not exist'
                ], 404);
            }

            // Soft delete by setting is_active to 0
            DB::table('bot_admins')
                ->where('id', $id)
                ->update([
                    'is_active' => 0,
                    'removed_at' => now(),
                    'removed_by' => 'dashboard'
                ]);

            Log::info('Bot admin removed successfully', [
                'admin_id' => $id,
                'user_id' => $admin->user_id,
                'username' => $admin->username,
                'removed_by' => 'dashboard'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Administrator removed successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error removing bot admin:', [
                'error' => $e->getMessage(),
                'admin_id' => $id
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to remove administrator',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update administrator status
     */
    public function updateStatus($id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $admin = DB::table('bot_admins')
                ->where('id', $id)
                ->first();

            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'error' => 'Administrator not found'
                ], 404);
            }

            $isActive = $request->status === 'active' ? 1 : 0;

            DB::table('bot_admins')
                ->where('id', $id)
                ->update([
                    'is_active' => $isActive,
                    'updated_at' => now()
                ]);

            Log::info('Bot admin status updated', [
                'admin_id' => $id,
                'user_id' => $admin->user_id,
                'new_status' => $request->status
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Administrator status updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating bot admin status:', [
                'error' => $e->getMessage(),
                'admin_id' => $id
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to update administrator status',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}