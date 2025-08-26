<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class BotModeratorController extends Controller
{
    /**
     * Get all bot moderators
     */
    public function index()
    {
        try {
            $moderators = DB::table('bot_moderators')
                ->select(['id', 'user_id', 'username', 'added_at', 'added_by', 'is_active'])
                ->where('is_active', 1)
                ->orderBy('added_at', 'desc')
                ->get()
                ->map(function ($moderator) {
                    return [
                        'id' => $moderator->id,
                        'user_id' => $moderator->user_id,
                        'username' => $moderator->username,
                        'added_at' => $moderator->added_at,
                        'added_by' => $moderator->added_by,
                        'status' => $moderator->is_active ? 'active' : 'inactive'
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $moderators
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching bot moderators:', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch moderators',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add a new bot moderator
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
            // Check if moderator already exists
            $existingModerator = DB::table('bot_moderators')
                ->where('user_id', $request->user_id)
                ->where('is_active', 1)
                ->first();

            if ($existingModerator) {
                return response()->json([
                    'success' => false,
                    'error' => 'Moderator already exists',
                    'message' => 'This user is already a moderator'
                ], 409);
            }

            // Insert new moderator
            $moderatorId = DB::table('bot_moderators')->insertGetId([
                'user_id' => $request->user_id,
                'username' => $request->username,
                'added_at' => now(),
                'added_by' => 'dashboard', // Could be auth user in the future
                'is_active' => 1
            ]);

            $newModerator = DB::table('bot_moderators')
                ->where('id', $moderatorId)
                ->first();

            Log::info('Bot moderator added successfully', [
                'user_id' => $request->user_id,
                'username' => $request->username,
                'added_by' => 'dashboard'
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $newModerator->id,
                    'user_id' => $newModerator->user_id,
                    'username' => $newModerator->username,
                    'added_at' => $newModerator->added_at,
                    'added_by' => $newModerator->added_by,
                    'status' => 'active'
                ],
                'message' => 'Moderator added successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error adding bot moderator:', [
                'error' => $e->getMessage(),
                'user_id' => $request->user_id,
                'username' => $request->username
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to add moderator',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove a bot moderator
     */
    public function destroy($id)
    {
        try {
            $moderator = DB::table('bot_moderators')
                ->where('id', $id)
                ->where('is_active', 1)
                ->first();

            if (!$moderator) {
                return response()->json([
                    'success' => false,
                    'error' => 'Moderator not found',
                    'message' => 'The specified moderator does not exist'
                ], 404);
            }

            // Soft delete by setting is_active to 0
            DB::table('bot_moderators')
                ->where('id', $id)
                ->update([
                    'is_active' => 0,
                    'removed_at' => now(),
                    'removed_by' => 'dashboard'
                ]);

            Log::info('Bot moderator removed successfully', [
                'moderator_id' => $id,
                'user_id' => $moderator->user_id,
                'username' => $moderator->username,
                'removed_by' => 'dashboard'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Moderator removed successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error removing bot moderator:', [
                'error' => $e->getMessage(),
                'moderator_id' => $id
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to remove moderator',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update moderator status
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
            $moderator = DB::table('bot_moderators')
                ->where('id', $id)
                ->first();

            if (!$moderator) {
                return response()->json([
                    'success' => false,
                    'error' => 'Moderator not found'
                ], 404);
            }

            $isActive = $request->status === 'active' ? 1 : 0;

            DB::table('bot_moderators')
                ->where('id', $id)
                ->update([
                    'is_active' => $isActive,
                    'updated_at' => now()
                ]);

            Log::info('Bot moderator status updated', [
                'moderator_id' => $id,
                'user_id' => $moderator->user_id,
                'new_status' => $request->status
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Moderator status updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating bot moderator status:', [
                'error' => $e->getMessage(),
                'moderator_id' => $id
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to update moderator status',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}