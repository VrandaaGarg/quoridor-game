"use client";

import "./Ghost.css";

interface GhostProps {
  color: "red" | "green";
  isMoving: boolean;
}

export default function Ghost({ color, isMoving }: GhostProps) {
  const colorClass = color === "red" ? "ghost-red" : "ghost-green";
  const animatingClass = isMoving ? "ghost-animating" : "";

  return (
    <div className={`ghost-container ${colorClass} ${animatingClass}`}>
      <div className="ghost-body">
        <div className="pupil"></div>
        <div className="pupil1"></div>
        <div className="eye"></div>
        <div className="eye1"></div>
        <div className="top0"></div>
        <div className="top1"></div>
        <div className="top2"></div>
        <div className="top3"></div>
        <div className="top4"></div>
        <div className="st0"></div>
        <div className="st1"></div>
        <div className="st2"></div>
        <div className="st3"></div>
        <div className="st4"></div>
        <div className="st5"></div>
        <div className="an1"></div>
        <div className="an2"></div>
        <div className="an3"></div>
        <div className="an4"></div>
        <div className="an5"></div>
        <div className="an6"></div>
        <div className="an7"></div>
        <div className="an8"></div>
        <div className="an9"></div>
        <div className="an10"></div>
        <div className="an11"></div>
        <div className="an12"></div>
        <div className="an13"></div>
        <div className="an14"></div>
        <div className="an15"></div>
        <div className="an16"></div>
        <div className="an17"></div>
        <div className="an18"></div>
      </div>
      <div className="ghost-shadow"></div>
    </div>
  );
}
