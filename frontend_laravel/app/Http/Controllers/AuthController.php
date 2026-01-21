<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Session;

class AuthController extends Controller
{
    protected $apiUrl;

    public function __construct()
    {
        // Python API URL
        $this->apiUrl = env('PYTHON_API_URL', 'http://127.0.0.1:8000');
    }

    public function showLogin()
    {
        return view('auth.login');
    }

    public function showRegister()
    {
        return view('auth.register');
    }

    public function register(Request $request)
    {
        // Basic validation on Laravel side (optional but good for UX)
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
            'role' => 'required|in:admin,user',
        ]);

        $payload = [
            'email' => $request->email,
            'password' => $request->password,
            'role' => $request->role,
        ];

        if ($request->role === 'admin') {
            $payload['username'] = $request->username;
            $payload['position'] = $request->jabatan; // Map 'jabatan' to 'position'
            $payload['passkey'] = $request->passkey;
        } else {
            $payload['name'] = $request->nama_pengguna; // Map 'nama_pengguna' to 'name'
            $payload['instansi'] = $request->nama_instansi; // Map 'nama_instansi' to 'instansi'
            $payload['address'] = $request->alamat;
            // email_pengaju is essentially the email, or is it separate?
            // User requirement: "email pengaju". I'll assume it's the main email.
            // If they mean a separate contact email, I might need to clarify, but for now I'll use the main email.
        }

        $response = Http::post($this->apiUrl . '/auth/register', $payload);

        if ($response->successful()) {
            return redirect()->route('login')->with('success', 'Registrasi berhasil! Silakan login.');
        }

        return back()->with('error', $response->json()['detail'] ?? 'Registrasi gagal')->withInput();
    }

    public function login(Request $request)
    {
        try {
            $response = Http::post($this->apiUrl . '/auth/login', [
                'email' => $request->email,
                'password' => $request->password,
            ]);

            \Illuminate\Support\Facades\Log::info('Login Response:', ['status' => $response->status(), 'body' => $response->json()]);

            if ($response->successful()) {
                $data = $response->json();
                Session::put('user', $data['user']);
                Session::put('token', $data['access_token']);
                Session::save(); // Force save
                return redirect()->route('dashboard');
            }

            return back()->with('error', $response->json()['detail'] ?? 'Login failed');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Login Error: ' . $e->getMessage());
            return back()->with('error', 'Connection error: ' . $e->getMessage());
        }
    }

    public function logout()
    {
        Session::forget('user');
        Session::forget('token');
        return redirect()->route('login');
    }
}
