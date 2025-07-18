/**
 * @file Tests for the audioPlayer module.
 * @module audioPlayer.test
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as child_process from "child_process";
import * as vscode from "vscode";
import * as audioPlayer from "../src/audioPlayer.js"; 

vi.mock("fs");
vi.mock("child_process");
vi.mock("vscode");

describe("audioPlayer", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("initialize should throw error if ffmpeg binaries are missing", () => {
    fs.existsSync.mockReturnValue(false);

    const context = { extensionPath: "/fake/path" };

    const showErrorSpy = vi.spyOn(vscode.window, "showErrorMessage");

    expect(() => audioPlayer.initialize(context)).toThrow(/Missing binaries/);
    expect(showErrorSpy).toHaveBeenCalledOnce();
  });

  test("getAudioDuration should parse valid output", async () => {
    const mockPath = "/some/song.wav";
    const durationInSec = "45.67";

    child_process.execFile.mockImplementation((bin, args, callback) => {
      callback(null, durationInSec, "");
    });

    const duration = await new Promise((resolve) =>
      audioPlayer.getAudioDuration(mockPath, resolve)
    );

    expect(duration).toBe(45);
  });

  test("getAudioDuration should return 0 on ffprobe error", async () => {
    child_process.execFile.mockImplementation((bin, args, callback) => {
      callback(new Error("ffprobe failed"), "", "stderr");
    });

    const duration = await new Promise((resolve) =>
      audioPlayer.getAudioDuration("invalid.wav", resolve)
    );

    expect(duration).toBe(0);
  });
});
